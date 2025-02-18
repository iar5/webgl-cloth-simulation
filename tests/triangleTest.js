{
    /**
     * (Sicht von oben) - Dreieck mit Normale nach oben (+y)
     * 
     *            ∧ y 
     *            |
     *         B(0,-2)  
     *            |
     *  ----------+-----------> x
     *            |
     *    C(2,2)  |   A(2,2)
     *            |
     * 
     */

    let a = new Vec3(2, 0, 2)
    let b = new Vec3(0, 0, -2)
    let c = new Vec3(-2, 0, 2)
    let tri = new Triangle(a, b, c)

    /**
     * 0.) TEST: Normalen Generierung
     */
    {
        let n = tri.n;
        console.assert(n.x==0 && n.y==1 &&n.z==0, "Normale")
    }

    /**
     * 1.) TEST: Triangle.getRayTriangleIntersection()
     */  
    {
        // Test: Treffer in Fläche
        {
            {
                //   ↓
                //   ▲
                let o = new Vec3(0, 5, 0);
                let v = new Vec3(0, -1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == 5, "getRayTriangleIntersection: Strahl über Dreieck, zeigt nach unten: t = " + t)
            }
            {
                //   ▲
                //   ↓
                let o = new Vec3(0, -5, 0);
                let v = new Vec3(0, -1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == -5, "getRayTriangleIntersection: Strahl unter Dreieck, zeigt nach unten: t = " + t)
            }
            {
                //   ↑
                //   ▲
                let o = new Vec3(0, 5, 0);
                let v = new Vec3(0, 1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == -5, "getRayTriangleIntersection: Strahl über Dreieck, zeigt nach oben: t = " + t)
            }
            {
                //   ▲
                //   ↑
                let o = new Vec3(0, -5, 0);
                let v = new Vec3(0, 1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == 5, "getRayTriangleIntersection: Strahl unter Dreieck, zeigt nach oben: t = " + t)
            }
        }

        // Test: Treffer auf Kante
        {
            {
                //  ↓
                //   ▲ 
                let o = new Vec3(2, 5, 2);
                let v = new Vec3(0, -1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == 5, t)
            }
            {
                //  ↑
                //   ▲ 
                let o = new Vec3(2, 5, 2);
                let v = new Vec3(0, 1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == -5, "getRayTriangleIntersection: Test an der Kante, Strahl über Dreieck, zeigt nach oben: t = " + t)
            }
        }
    
        // Test: Kein Treffer
        {
            {
                // ↑ 
                //   ▲ 
                let o = new Vec3(2.001, 5, 2);
                let v = new Vec3(0, 1, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == null, "Senkrecht vorbei")
            }
            {
                //   →
                //   ▲ 
                let o = new Vec3(0, 5, 0);
                let v = new Vec3(1, 0, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == null, "Parallel vobei")
            }
            {
                //   ←
                //   ▲ 
                let o = new Vec3(0, 5, 0);
                let v = new Vec3(-1, 0, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == null, "Parallel vobei")
            }
            {
                //   
                // → ▲ 
                let o = new Vec3(5, 0, 0);
                let v = new Vec3(1, 0, 0);
                let t = tri.getRayTriangleIntersection(o, v)
                console.assert(t == null, "Parallel in der Ebene")
            }
        }

        // Test: Ganz nah dran (Präzision) 
        { 
            { 
                let t = tri.getRayTriangleIntersection(new Vec3(0, 0.01, 0), new Vec3(0, -1, 0))
                console.assert(t == 0.01, t)
            }
            { 
                let t = tri.getRayTriangleIntersection(new Vec3(0, 0.001, 0), new Vec3(0, -1, 0))
                console.assert(t == 0.001, t)
            }
            { 
                let t = tri.getRayTriangleIntersection(new Vec3(0, 0.0001, 0), new Vec3(0, -1, 0))
                console.assert(t == 0.0001, t)
            }
            { 
                let t = tri.getRayTriangleIntersection(new Vec3(0, 0.00001, 0), new Vec3(0, -1, 0))
                console.assert(t == 0.00001, t)
            }
            { 
                let t = tri.getRayTriangleIntersection(new Vec3(0, 0.000001, 0), new Vec3(0, -1, 0))
                console.assert(t == 0.000001, t)
            }    { 
                let t = tri.getRayTriangleIntersection(new Vec3(0, 0.000001, 0), new Vec3(0, -1, 0))
                console.assert(t == 0.000001, t)
            }
        }
    }
    
    /**
     * 2.) TEST: Triangle.getSegmentContact()
     */
    {
        let a = new Vec3(-1, -1, 0);
        let b = new Vec3(1, 1, 0);
        let contact = tri.getSegmentContact(a, b)
        console.assert(Vec3.equals(contact.point, new Vec3(0,0,0)))
    }

    /**
     * 3.) TEST: Triangle.resolveContinousPointCollision()
     */
    {
        //let p = new Particle(-1, -1, 0);
        //let contact = tri.resolveContinousPointCollision(a, b)
        //console.assert(Vec3.equals(contact.point, new Vec3(0,0,0)))
    }

    {
        console.assert(tri.isPointInFront(new Vec3(0, 0.00000000001, 0)))
        console.assert(!tri.isPointInFront(new Vec3(0, -0.00000000001, 0)))
    }
    {
        console.assert(tri.getRayTriangleIntersection(new Vec3(1, 0.00001, 0), new Vec3(-1, -0.00001, 0)))
    }
}
